import { IsInt, IsOptional, IsString, IsISO8601, Min } from "class-validator";
import { Type } from "class-transformer";

export class SearchEventsDto {
  @IsOptional() @IsISO8601() from?: string;
  @IsOptional() @IsISO8601() to?: string;

  @IsOptional() @IsString() userId?: string;
  @IsOptional() @IsString() browser?: string;
  @IsOptional() @IsString() url?: string;
  @IsOptional() @IsString() keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  fromOffset?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  size?: number;
}
