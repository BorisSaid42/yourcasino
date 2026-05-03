import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class InsurancePayloadDTO {
  @IsUUID()
  lobbyId: string;

  @IsUUID()
  userId: string;

  @IsOptional()
  @IsBoolean()
  hasInsured: boolean;
}
