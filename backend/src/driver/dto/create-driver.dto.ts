import {IsString, IsEmail, IsOptional, IsNumber} from 'class-validator';

export class CreateDriverDto {
    @IsString()
    name: string;

    @IsString()
    cedulaNumber: string;

    @IsString()
    phone: string;
    
    @IsString()
    @IsOptional()
    licenseNumber: string;
    
    @IsEmail()
    email: string;
    
    @IsNumber()
    userId: number;
}