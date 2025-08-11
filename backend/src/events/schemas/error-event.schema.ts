import { Schema, SchemaFactory, Prop } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ collection: "raw_error_events", timestamps: true })
export class ErrorEvent extends Document {
  @Prop({ required: true }) timestamp!: Date;
  @Prop({ required: true }) userId!: string;
  @Prop({ required: true }) browser!: string;
  @Prop({ required: true }) url!: string;
  @Prop({ required: true }) errorMessage!: string;
  @Prop({ required: true }) stackTrace!: string;
}

export const ErrorEventSchema = SchemaFactory.createForClass(ErrorEvent);
