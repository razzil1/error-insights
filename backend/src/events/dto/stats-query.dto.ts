import { IsOptional, IsString, IsISO8601 } from "class-validator";
export class StatsQueryDto {
  @IsOptional() @IsISO8601() from?: string;
  @IsOptional() @IsISO8601() to?: string;
  @IsOptional() @IsString() termField?: "browser" | "userId" | "url";
}
