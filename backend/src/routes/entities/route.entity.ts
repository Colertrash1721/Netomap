import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';

@Entity('deviceinroutes') // Nombre de la tabla en la base de datos
export class Routes {
  @PrimaryGeneratedColumn()
  idRute: number; // Coincide con idRute en la tabla

  @Column({ length: 100 })
  rute_Name: string; // Coincide con rute_Name en la tabla

  @Column({ length: 50, nullable: true })
  device_Name: string; // Coincide con device_Name en la tabla

  @Column({ length: 50 })
  Startlatitud: string; // Coincide con Startlatitud en la tabla

  @Column({ length: 50 })
  Startlongitud: string; // Coincide con Startlongitud en la tabla

  @ManyToMany(() => Routes)
  idDriver: number; // Coincide con idDriver en la tabla

  @Column({ length: 50 })
  Endlatitud: string; // Coincide con Endlatitud en la tabla

  @Column({ length: 50 })
  Endlongitud: string; // Coincide con Endlongitud en la tabla

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  creationDate: Date; // Coincide con creationDate en la tabla

  @Column({type: 'int', nullable: true})
  locationIntegrationId: number;
}