import { IsIn, IsInt, IsPositive, IsString, MinLength } from 'class-validator';
import { MediaAttachmentType } from '../media.constants';

export class CreatePresignedUploadDto {
  @IsIn(['image', 'audio'])
  mediaType: MediaAttachmentType;

  @IsString()
  @MinLength(3)
  mimetype: string;

  @IsInt()
  @IsPositive()
  sizeBytes: number;
}

export class ConfirmMediaUploadDto {
  @IsString()
  @MinLength(3)
  key: string;

  @IsInt()
  @IsPositive()
  sizeBytes: number;
}

// Used to clean up an upload that was confirmed but then replaced/removed
// by the lecturer before the question itself was saved.
export class ReleaseMediaUploadDto {
  @IsString()
  @MinLength(3)
  key: string;

  @IsInt()
  @IsPositive()
  sizeBytes: number;
}
