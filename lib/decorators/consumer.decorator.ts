import { SetMetadata } from "@nestjs/common"
import { CONSUMER, } from "../amqp.constants"

export const Consumer = (): ClassDecorator => {
    return (target: Function) => {
        SetMetadata(CONSUMER, true)(target)
    }
}
