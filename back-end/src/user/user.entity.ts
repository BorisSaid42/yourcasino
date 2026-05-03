import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Lobby } from '../lobby/lobby.entity';
import { UserWallet } from './user-wallet.entity';
import { UserTransaction } from '../transaction/user-transaction.entity';
import { Notification } from '../notification/notification.entity';
import { RouletteBet } from '../roulette/roulette-bet.entity';
import { VerificationEntity } from 'src/verification/verification.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column()
  public googleId: string;

  @Column()
  public email: string;

  @Column()
  public username: string;

  @Column()
  public displayName: string;

  @Column({ type: 'varchar', length: 256, nullable: true })
  public password: string | null;

  @Column({ type: 'float', default: 0 })
  public balance: number;

  @Column({ type: 'varchar', nullable: true })
  public avatarUrl: string | null;

  @Column({ type: 'timestamp', nullable: true })
  public emailVerifiedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  public bannedUntil: Date | null;

  @OneToMany(() => Lobby, (lobby) => lobby.owner)
  public lobbies: Lobby[];

  @OneToMany(() => UserWallet, (wallet) => wallet.user)
  public wallets: UserWallet[];

  @OneToMany(() => UserTransaction, (transaction) => transaction.user)
  public transactions: UserTransaction[];

  @OneToMany(() => RouletteBet, (bet) => bet.user)
  public bets: RouletteBet[];

  @Column({ type: 'timestamp' })
  public resetStatsAt: Date;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;

  @OneToMany(() => Notification, (notification) => notification.user)
  public notifications: Notification[];

  @OneToOne(() => VerificationEntity, (verification) => verification.user)
  verification?: VerificationEntity;
}
