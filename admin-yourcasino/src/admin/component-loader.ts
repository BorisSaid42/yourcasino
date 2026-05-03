import { ComponentLoader } from 'adminjs';

const componentLoader = new ComponentLoader();

componentLoader.add('CustomDashboard', './components/Dashboard');
componentLoader.add('Balances', './components/Balances');
componentLoader.add('OutstandingBalance', './components/OutstandingBalance');
componentLoader.add('WithdrawRequests', './components/WithdrawRequests');
componentLoader.add('UserStatsShow', './components/UserStatsShow');
componentLoader.add('UserListResponsive', './components/UserList');
componentLoader.add('LobbyListResponsive', './components/LobbyList');
componentLoader.add('RouletteGameListResponsive', './components/RouletteGameList');
componentLoader.add('RouletteGameShowResponsive', './components/RouletteGameShow');
componentLoader.add('BlackjackGameListResponsive', './components/BlackjackGameList');
componentLoader.add('BlackjackGameShowResponsive', './components/BlackjackGameShow');
componentLoader.override('LoggedIn', './components/MaintenanceToggle');

export default componentLoader;
