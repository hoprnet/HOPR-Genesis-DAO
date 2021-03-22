import { Text } from "@chakra-ui/react";
import { Box, Slider, SliderFilledTrack, SliderThumb, SliderTrack, Tooltip } from "@chakra-ui/react"
import { GiFarmTractor } from "react-icons/gi";

export const DEFAULT_COUNTDOWN = 99999;
export const TOTAL_CLAIM_PERIOD = 13;
export const WEEKLY_BLOCK_NUMBER = 44800; 

export const ProgressBar = ({ currentPeriod, countdown}) => {
    const isText = currentPeriod === 0 && countdown === DEFAULT_COUNTDOWN || currentPeriod > TOTAL_CLAIM_PERIOD;
    const value = isText ? 0 : ((1 + currentPeriod) * WEEKLY_BLOCK_NUMBER - countdown)/(TOTAL_CLAIM_PERIOD * WEEKLY_BLOCK_NUMBER);
    // const {colorMode} = useColorMode() //colorScheme={color[colorMode]}
  return (
    <Box my={4}>
        {
            isText ? <Text>{currentPeriod > TOTAL_CLAIM_PERIOD ? "Farm is closed!" : "Farm has not started yet."}</Text> :
            <Slider aria-label="slider-ex-4" value={value} size="lg" isReadOnly my={4}>
            <Tooltip label="Farm ends" placement="bottom-end" isOpen mt={2}>
                <SliderTrack size="xl" h={5}>
                    <Tooltip label="Farm starts" placement="bottom-start" isOpen mt={2}>
                        <SliderFilledTrack bg="farmProgress.200"/>
                    </Tooltip>
                </SliderTrack>
                </Tooltip>
                <Tooltip hasArrow label={`Currently in period ${currentPeriod}. Next period starts in ${countdown} blocks`} placement="top-end" isOpen >
                    <SliderThumb boxSize={9} bgColor="farmProgress.200" >
                        <Box color="farmProgress.500" as={GiFarmTractor} fontSize="2xl"/>
                    </SliderThumb>
            </Tooltip>
        </Slider>
        }
    </Box>
    
  )
}