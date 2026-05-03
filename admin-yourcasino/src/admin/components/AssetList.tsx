import React from 'react';
import { Box, Text } from '@adminjs/design-system';

const AssetList = (props: any) => {
  const asset = props.record?.params?.asset;

  return (
    <Box style={{ minWidth: '60px' }}>
      <Text style={{ fontSize: '14px', fontWeight: 500, fontFamily: 'monospace' }}>{asset}</Text>
    </Box>
  );
};

export default AssetList;
