import { useWindowDimensions } from 'react-native';
import { Breakpoints } from './tokens';

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= Breakpoints.sm;
  const isLargeTablet = width >= Breakpoints.md;
  const isLandscape = width > height;
  const showMasterDetail = isTablet && isLandscape;

  return { width, height, isTablet, isLargeTablet, isLandscape, showMasterDetail };
}
