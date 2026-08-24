import { DeleteObjectsCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';

// Bulk-deletes every OBJECT under one or more R2 key prefixes — R2/S3 has no
// real folders, so "clear the questions/ folder without deleting the folder"
// just means: delete every object whose key starts with that prefix, which
// naturally leaves nothing behind (there's no separate folder marker object
// to remove). Safe-by-default: without --confirm this only lists what WOULD
// be deleted and does nothing.
//
// Usage: npx ts-node scripts/clear-r2-prefix.ts --target=questions|evidence|all [--confirm]

const PREFIXES_BY_TARGET: Record<string, string[]> = {
  questions: ['questions/'],
  evidence: ['proctoring-evidence/'],
  all: ['questions/', 'proctoring-evidence/'],
};

// Permanent demo media referenced by seed data (see seed-question-bank.ts,
// course "seven-types") — must survive every "CQM"/"CAM" Zalo wipe, so it's
// never deleted no matter what target is chosen or how PREFIXES_BY_TARGET
// above changes later.
const PROTECTED_PREFIXES = ['question-samples/'];
function isProtected(key: string) {
  return PROTECTED_PREFIXES.some((p) => key.startsWith(p));
}

function parseArgs() {
  const target = process.argv.find((a) => a.startsWith('--target='))?.split('=')[1];
  const confirm = process.argv.includes('--confirm');
  return { target, confirm };
}

async function deleteAllUnderPrefix(s3: S3Client, bucket: string, prefix: string, confirm: boolean) {
  let continuationToken: string | undefined;
  let totalListed = 0;
  let totalDeleted = 0;

  do {
    const listed = await s3.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: continuationToken }),
    );
    const allKeys = (listed.Contents || []).map((o) => o.Key).filter((k): k is string => Boolean(k));
    const keys = allKeys.filter((k) => !isProtected(k));
    const skipped = allKeys.length - keys.length;
    if (skipped > 0) {
      console.log(`Skipping ${skipped} protected object(s) under ${prefix}`);
    }
    totalListed += keys.length;

    if (keys.length > 0 && confirm) {
      // DeleteObjects caps at 1000 keys per call — same page size ListObjectsV2 already uses.
      const result = await s3.send(
        new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true } }),
      );
      totalDeleted += keys.length - (result.Errors?.length || 0);
      for (const err of result.Errors || []) {
        console.error(`Failed to delete ${err.Key}: ${err.Code} ${err.Message}`);
      }
    }

    continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
  } while (continuationToken);

  return { totalListed, totalDeleted };
}

async function main() {
  const { target, confirm } = parseArgs();
  const prefixes = target ? PREFIXES_BY_TARGET[target] : undefined;
  if (!prefixes) {
    console.error(`Missing/invalid --target (expected one of: ${Object.keys(PREFIXES_BY_TARGET).join(', ')})`);
    process.exit(1);
  }

  const accountId = process.env.R2_ACCOUNT_ID;
  const endpoint = process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);
  const bucket = process.env.R2_BUCKET_NAME || '';
  const s3 = new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
  });

  if (!confirm) {
    console.log(`DRY RUN (pass --confirm to actually delete) — target="${target}", bucket="${bucket}"`);
  }

  for (const prefix of prefixes) {
    const { totalListed, totalDeleted } = await deleteAllUnderPrefix(s3, bucket, prefix, confirm);
    console.log(
      confirm
        ? `${prefix}: deleted ${totalDeleted}/${totalListed} object(s)`
        : `${prefix}: would delete ${totalListed} object(s)`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
