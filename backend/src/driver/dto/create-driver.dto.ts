import {IsString, IsEmail, IsOptional} from 'class-validator';

export class CreateDriverDto {
    @IsString()
    name: string;

    @IsEmail()
    email: string;

    @IsString()
    phone: string;

    @IsString()
    cedulaNumber: string;

    @IsString()
    @IsOptional()
    licenseNumber: string;
}
