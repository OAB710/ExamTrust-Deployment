import { IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

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
}
