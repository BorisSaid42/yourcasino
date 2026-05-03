import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class UpdateLobbiesTable1751549378533 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('lobbies');
    if (!table) return;

    await queryRunner.addColumns('lobbies', [
      new TableColumn({
        name: 'owner_id',
        type: 'varchar',
        length: '36',
        isNullable: true,
      }),
      new TableColumn({
        name: 'max_seats',
        type: 'int',
        default: 5,
      }),
    ]);

    await queryRunner.query(`UPDATE lobbies SET owner_id = user_id`);

    await queryRunner.changeColumn(
      'lobbies',
      new TableColumn({
        name: 'owner_id',
        type: 'varchar',
        length: '36',
        isNullable: true,
      }),
      new TableColumn({
        name: 'owner_id',
        type: 'varchar',
        length: '36',
        isNullable: false,
      }),
    );
    await queryRunner.dropForeignKey('lobbies', 'FK_lobbies-user');
    await queryRunner.dropColumns('lobbies', ['user_id', 'deck']);

    await queryRunner.createForeignKey(
      'lobbies',
      new TableForeignKey({
        name: 'FK_lobbies-owner',
        columnNames: ['owner_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('lobbies', 'FK_lobbies-owner');

    await queryRunner.addColumns('lobbies', [
      new TableColumn({
        name: 'user_id',
        type: 'varchar',
        length: '36',
        isNullable: true,
      }),
      new TableColumn({
        name: 'deck',
        type: 'jsonb',
        isNullable: true,
      }),
    ]);

    await queryRunner.query(`UPDATE lobbies SET user_id = owner_id`);

    await queryRunner.changeColumn(
      'lobbies',
      new TableColumn({
        name: 'user_id',
        type: 'varchar',
        length: '36',
        isNullable: true,
      }),
      new TableColumn({
        name: 'user_id',
        type: 'varchar',
        length: '36',
        isNullable: false,
      }),
    );

    await queryRunner.dropColumns('lobbies', ['owner_id', 'max_seats']);

    await queryRunner.createForeignKey(
      'lobbies',
      new TableForeignKey({
        name: 'FK_lobbies-user',
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }
}
