import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('concurrentsroutes') // Nombre de la tabla en la base de datos
export class Concurrent {
  @PrimaryGeneratedColumn()
  idRoute: number; // Coincide con idRute en la tabla

  @Column({ length: 100 })
  routeName: string; // Coincide con routeName en la tabla

  @Column({ length: 50, nullable: true })
  Startlatitud: string; // Coincide con Startlatitud en la tabla

  @Column({ length: 50 })
  Startlongitud: string; // Coincide con Startlongitud en la tabla

  @Column({ length: 50 })
  Endlatitud: string; // Coincide con Endlatitud en la tabla

  @Column({ length: 50 })
  Endlongitud: string; // Coincide con Endlongitud en la tabla
}