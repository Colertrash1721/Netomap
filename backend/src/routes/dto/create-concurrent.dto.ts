import { IsString } from "class-validator";

export class CreateConcurrentDto {
    @IsString()
    routeName: string

    @IsString()
    Startlatitud: string

    @IsString()
    Startlongitud: string

    @IsString()
    Endlatitud: string

    @IsString()
    Endlongitud: string
}
