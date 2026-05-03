import { IsUUID } from 'class-validator';

export class LobbyGatewayPayloadDTO {
  @IsUUID()
  lobbyId: string;
}
