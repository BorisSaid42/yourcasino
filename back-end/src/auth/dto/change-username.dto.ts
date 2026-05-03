import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class ChangeUsernameDto {
  @IsString()
  @IsNotEmpty({ message: 'Username is required' })
  @Length(3, 15, {
    message: 'Username must be between 3 and 15 characters',
  })
  @Matches(/^(?!.*[-_]{3})[a-zA-Z0-9][a-zA-Z0-9-_]*$/, {
    message:
      'Username must start with a letter or number and use only letters, numbers, and at most two symbols (- or _) at a time',
  })
  newUsername: string;
}
