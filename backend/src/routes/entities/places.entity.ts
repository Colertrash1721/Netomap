import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('places')
export class Places {
  @PrimaryGeneratedColumn({ name: 'idPlace' })
  idPlace: number;

  @Column({ name: 'name', length: 100 })
  name: string;

  @Column({ name: 'latitude', length: 50, nullable: true })
  latitude: string;

  @Column({ name: 'longitude', length: 50 })
  longitude: string;

  @Column({ name: 'active', type: 'tinyint', default: true })
  active: boolean;

  @Column({ name: 'private', type: 'tinyint', default: false })
  private: boolean;

  @Column({ name: 'integrationId', type: 'int', default: 0 })
  integrationId: number;
}