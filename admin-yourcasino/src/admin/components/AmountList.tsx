import React from 'react';
import { Box, Text } from '@adminjs/design-system';

const AmountList = (props: any) => {
  const amount = props.record?.params?.amount;

  return (
    <Box style={{ minWidth: '80px' }}>
      <Text style={{ fontSize: '14px', fontWeight: 500, fontFamily: 'monospace' }}>
        {amount != null ? Number(amount).toFixed(6) : '-'}
      </Text>
    </Box>
  );
};

export default AmountList;
