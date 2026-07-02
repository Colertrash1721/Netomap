import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';

@Entity('deviceinroutes') // Nombre de la tabla en la base de datos
export class Routes {
  @PrimaryGeneratedColumn()
  idRute: number;

  @Column({ length: 100 })
  rute_Name: string;

  @Column({ length: 50, nullable: true })
  device_Name: string;

  @Column({ length: 50 })
  Startlatitud: string;

  @Column({ length: 50 })
  Startlongitud: string;

  @ManyToMany(() => Routes)
  idDriver: number;

  @Column({ length: 50 })
  Endlatitud: string;

  @Column({ length: 50 })
  Endlongitud: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  creationDate: Date;

  @Column({ type: 'json', nullable: true })
  routeGeometry: any;

  @Column({ type: 'json', nullable: true })
  routeAlternatives: any;

  @Column({ type: 'int', default: 100 })
  thresholdMeters: number;
}