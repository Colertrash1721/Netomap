// events.entity.ts
import { Column, Entity, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';

@Entity('events')
export class Events {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;
  
  @Column({ type: 'int', name: 'idEvent' })
  idEvent: number;

  @Column({ type: 'int', nullable: true })
  idRoute: number | null;

  @Column()
  deviceName: string;

  @Column({ type: 'varchar', nullable: true })
  eventType: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  eventDate: Date;
}
