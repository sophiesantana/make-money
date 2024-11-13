import { ApiProperty } from "@nestjs/swagger";

export class DepositUserDto {
  @ApiProperty()
  amount: number;
}
