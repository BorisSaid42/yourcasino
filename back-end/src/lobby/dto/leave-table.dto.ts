import { IsNumber, IsUUID, Max, Min } from 'class-validator';

export class LeaveTableDto {
  @IsUUID()
  lobbyId: string;

  @IsNumber()
  @Max(4)
  @Min(0)
  seatIndex: number;
}
