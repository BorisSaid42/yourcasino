import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import * as dotenv from 'dotenv';

export class AddLobbiesInviteLinkColumn1750151647937 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    dotenv.config();
    const appUrl = process.env.APP_URL;

    if (!appUrl) {
      throw new Error('APP_URL is not defined in .env');
    }

    await queryRunner.addColumn(
      'lobbies',
      new TableColumn({
        name: 'invite_link',
        type: 'varchar',
        length: '256',
        isNullable: true,
      }),
    );

    await queryRunner.query(`
        UPDATE lobbies
        SET invite_link = CONCAT('${appUrl}/lobby/', code)
      `);

    await queryRunner.changeColumn(
      'lobbies',
      'invite_link',
      new TableColumn({
        name: 'invite_link',
        type: 'varchar',
        length: '256',
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('lobbies', 'invite_link');
  }
}
