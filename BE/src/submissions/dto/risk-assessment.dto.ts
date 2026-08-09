import { IsBoolean, IsEnum, IsIn, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export enum RiskFlagDecision {
  REVIEWED = 'REVIEWED',
  DISMISSED = 'DISMISSED',
  CONFIRMED = 'CONFIRMED',
}

export class ReviewAnomalyFlagDto {
  @IsEnum(RiskFlagDecision)
  status: RiskFlagDecision;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class ReviewIntegrityCaseDto {
  @IsEnum(RiskFlagDecision)
  status: RiskFlagDecision;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsIn([10, 25, 50, 100])
  deductionPercent?: 10 | 25 | 50 | 100;

  @IsOptional()
  @IsBoolean()
  applyPenalty?: boolean;

  @IsOptional()
  @IsIn(['PERCENT', 'FIXED'])
  penaltyMode?: 'PERCENT' | 'FIXED';

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(10)
  penaltyAmount?: number;
}
