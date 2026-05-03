import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/user/user.entity';
import { CodeVerificationType } from 'src/auth/dto/verification.dto';

export type ICodeType = 'token' | 'code';
export const codeType = ['token', 'code'];

@Entity({ name: 'code_verifications' })
export class VerificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  code: string;

  @Column()
  used: boolean;

  @Column({ type: 'enum', enum: CodeVerificationType })
  type: CodeVerificationType;

  @RelationId((verification: VerificationEntity) => verification.user)
  userId: string;

  @OneToOne(() => User, (user) => user.verification)
  @JoinColumn()
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  expireAt: Date;
}
