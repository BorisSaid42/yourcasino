cd /var/www/yourcasino/back-end
pm2 start dist/main.js --name backend

cd /var/www/yourcasino/front-end
pm2 start npm --name front -- run start

cd /var/www/yourcasino/admin-yourcasino
pm2 start npm --name admin -- run dev
