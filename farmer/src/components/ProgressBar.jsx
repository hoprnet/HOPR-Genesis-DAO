import { Box, Slider, SliderFilledTrack, SliderThumb, SliderTrack, Tooltip, Text } from "@chakra-ui/react"
import { GiFarmTractor } from "react-icons/gi";

export const DEFAULT_COUNTDOWN = 99999;
export const TOTAL_CLAIM_PERIOD = 13;
export const WEEKLY_BLOCK_NUMBER = 44800; 

export const ProgressBar = ({ currentPeriod, countdown, rightChain}) => {
    const isText = (!rightChain) || currentPeriod > TOTAL_CLAIM_PERIOD;
    const value = isText ? 0 : ((1 + currentPeriod) * WEEKLY_BLOCK_NUMBER - countdown)/(TOTAL_CLAIM_PERIOD * WEEKLY_BLOCK_NUMBER) * 100;
    
  return (
    <Box my={4}>
        {
            isText ? <Text>{rightChain ? "Farm is closed! Please destroy your farm." : "Please connect your wallet to Ethereum Mainnet."}</Text> :
            <Slider aria-label="slider-ex-4" value={value} size="lg" isReadOnly my={4}>
            <Tooltip label="Farm end" placement="bottom-end" isOpen mt={2}>
                <SliderTrack size="xl" h={5}>
                    <Tooltip label="Farm start" placement="bottom-start" isOpen mt={2}>
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