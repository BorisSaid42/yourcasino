import { Box, Button, DropDownItem, DropDownMenu, Icon, Loader } from '@adminjs/design-system';
import { useCurrentAdmin, useNotice } from 'adminjs';
import axios from 'axios';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MaintenanceType } from '../../entities/maintenance.entity.js';

const MaintenanceTypeToPropertyName = {
  [MaintenanceType.FULL]: 'isInMaintenance',
  [MaintenanceType.PAUSE]: 'isPaused',
  [MaintenanceType.PAUSE_BLACKJACK]: 'isBlackjackPaused',
  [MaintenanceType.PAUSE_ROULETTE]: 'isRoulettePaused',
}

const MaintenanceToggle: React.FC = () => {
  const [admin] = useCurrentAdmin();
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const sendNotice = useNotice();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [maintenanceStatus, setMaintenanceStatus] = useState({
    isInMaintenance: false,
    isPaused: false,
    isBlackjackPaused: false,
    isRoulettePaused: false,
  });

  useEffect(() => {
    axios.get('/admin/maintenance/status').then(res => {
      setMaintenanceStatus({
        isInMaintenance: !!res.data.find((m) => m.type === MaintenanceType.FULL),
        isPaused: !!res.data.find((m) => m.type === MaintenanceType.PAUSE),
        isBlackjackPaused: !!res.data.find((m) => m.type === MaintenanceType.PAUSE_BLACKJACK),
        isRoulettePaused: !!res.data.find((m) => m.type === MaintenanceType.PAUSE_ROULETTE),
      })
      console.log();
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMaintenance = async (type: MaintenanceType) => {
    setLoading(true);
    try {
      const { data } = await axios.post('/admin/maintenance/toggle', { type });
      setMaintenanceStatus((prevStatus) => ({ ...prevStatus, [MaintenanceTypeToPropertyName[type]]: data.enabled }))
      sendNotice({
        message: 'Maintenance updated successfully',
        type: 'success',
      });
    } catch (err) {
      sendNotice({ message: 'Failed to toggle maintenance', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    window.location.href = '/admin/logout';
  };

  return (
    <Box ref={dropdownRef} style={{ position: 'relative' }}>
      <Button size="sm" variant="text" onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center' }}>
        <Icon icon="User" />
        <Box ml="sm">{admin?.email || 'Admin'}</Box>
        <Icon icon={open ? 'ChevronUp' : 'ChevronDown'} ml="xs" />
      </Button>

      {open && (
        <DropDownMenu style={{ right: 0, position: 'absolute', top: 'calc(100% + 4px)' }}>
          <DropDownItem onClick={() => toggleMaintenance(MaintenanceType.FULL)} icon={maintenanceStatus.isInMaintenance ? 'Pause' : 'Play'}>
            {loading ? <Loader /> : maintenanceStatus.isInMaintenance ? 'Turn Full Maintenance OFF' : 'Turn Full Maintenance ON'}
          </DropDownItem>
          <DropDownItem onClick={() => toggleMaintenance(MaintenanceType.PAUSE)} icon={maintenanceStatus.isPaused ? 'Pause' : 'Play'}>
            {loading ? <Loader /> : maintenanceStatus.isPaused ? 'Pause OFF' : 'Pause ON'}
          </DropDownItem>
          <DropDownItem onClick={() => toggleMaintenance(MaintenanceType.PAUSE_BLACKJACK)} icon={maintenanceStatus.isBlackjackPaused ? 'Pause' : 'Play'}>
            {loading ? <Loader /> : maintenanceStatus.isBlackjackPaused ? 'Pause Blackjack OFF' : 'Pause Blackjack ON'}
          </DropDownItem>
          <DropDownItem onClick={() => toggleMaintenance(MaintenanceType.PAUSE_ROULETTE)} icon={maintenanceStatus.isRoulettePaused ? 'Pause' : 'Play'}>
            {loading ? <Loader /> : maintenanceStatus.isRoulettePaused ? 'Pause Roulette OFF' : 'Pause Roulette ON'}
          </DropDownItem>
          <DropDownItem onClick={logout} icon="Logout">
            Log out
          </DropDownItem>
        </DropDownMenu>
      )}
    </Box>
  );
};

export default MaintenanceToggle;
