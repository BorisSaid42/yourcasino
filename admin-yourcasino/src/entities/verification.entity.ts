import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type ICodeType = 'token' | 'code';
export const codeType = ['token', 'code'];

export enum CodeVerificationType {
  REGISTER = 'register',
  RESET_PASSWORD = 'reset-password',
}

@Entity({ name: 'code_verifications' })
export class VerificationEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  code: string;

  @Column()
  used: boolean;

  @Column({ type: 'enum', enum: CodeVerificationType })
  type: CodeVerificationType;

  @Column({ type: 'varchar', nullable: true })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  expireAt: Date;
}
