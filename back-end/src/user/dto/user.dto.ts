import { Expose } from 'class-transformer';
import { User } from '../user.entity';

export class UserDTO {
  @Expose()
  public id: string;

  @Expose()
  public username: string;

  @Expose()
  public balance: number;

  @Expose()
  public email: string;

  @Expose()
  public createdAt: Date;

  @Expose()
  public intercomHash?: string;

  constructor(data: User, intercomHash?: string) {
    this.id = data.id;
    this.username = data.username;
    this.balance = data.balance;
    this.email = data.email;
    this.createdAt = data.createdAt;
    this.intercomHash = intercomHash;
  }
}
