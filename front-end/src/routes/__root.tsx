import { Outlet, createRootRoute, redirect } from '@tanstack/react-router';
import { Slide, ToastContainer } from 'react-toastify';
import { Footer } from '../components/footer/footer';
import { NavBar } from '../components/nav';
import { ModalProvider } from '../providers/modal/provider';
import { SocketLockProvider } from '../providers/socket-locks/provider';
import { UserProvider } from '../providers/user/provider';
import { IntercomProvider } from '../components/intercom/intercom-provider';

export const Route = createRootRoute({
  component: RootComponent,
  beforeLoad: async () => {
    const maintenance = typeof localStorage !== 'undefined' ? localStorage.getItem('__yourcasino.maintenance') : '0';
    const redirectTo = maintenance === '1' ? '/maintenance' : undefined;

    if (redirectTo && location.pathname !== redirectTo) {
      throw redirect({ to: redirectTo });
    }
  },
});

function RootComponent() {
  return (
    <SocketLockProvider>
      <UserProvider>
        <ModalProvider>
          <NavBar />
          <div className="flex w-full">
            <main
              id="site-main"
              className="scrollbar-thin flex h-full min-h-[calc(100vh_-_68px)] w-[calc(100%-300px)] flex-grow flex-col bg-[url('/src/assets/game-background-mosaic.png')] bg-cover bg-center max-lg:pt-[73px] max-md:pt-[68px]"
            >
              <div id="main-top" className="h-0 w-0" />
              <IntercomProvider>
                <Outlet />
              </IntercomProvider>
              <Footer />
              <ToastContainer
                position="bottom-right"
                autoClose={5000}
                hideProgressBar={false}
                closeOnClick={false}
                transition={Slide}
                closeButton={false}
                className="right-3 !m-0 overflow-hidden !rounded-[12px] !bg-transparent !p-0"
                toastClassName="!bg-[#182E51] !shadow-none !p-0 !m-0"
                style={{ zIndex: 9999, right: 10, bottom: 72, background: 'transparent', padding: 0 }}
              />
            </main>
          </div>
        </ModalProvider>
      </UserProvider>
    </SocketLockProvider>
  );
}
