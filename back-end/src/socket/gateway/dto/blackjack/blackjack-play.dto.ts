import { IsUUID } from 'class-validator';

export class BlackjackPlayDTO {
  @IsUUID()
  lobbyId: string;

  @IsUUID()
  userId: string;
}
