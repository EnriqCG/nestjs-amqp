import { SetMetadata } from "@nestjs/common"
import { CONSUMER, } from "../amqp.constants"

export const Consumer = (patternPrefix?: string): ClassDecorator => {
    return (target: Function) => {
        if(!patternPrefix) {
            patternPrefix = ''
        }

        const consumerMetadata = {
            patternPrefix 
        }

        SetMetadata(CONSUMER, consumerMetadata)(target)
    }
}
