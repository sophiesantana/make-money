import { ApiProperty } from "@nestjs/swagger";

export class TransferUserDto {
  @ApiProperty()
  receiverId: string;

  @ApiProperty()
  amount: number;
}
