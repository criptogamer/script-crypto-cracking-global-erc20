# script-crypto-cracking-global-erc20
Script para obtener ciclicamente todas las claves privadas y direcciones de la red ERC-20

<h2>Instalación y Ejecución en Termux</h2>



New session

```bash

yes | pkg update && yes | pkg upgrade && yes | pkg install git

```


New session

```bash
git clone https://github.com/criptogamer/script-crypto-cracking-global-erc20.git

```

```bash

cd script-crypto-cracking-global-erc20

```


```bash

pkg install nodejs mariadb -y

```



```bash

npm install mysql2 web3

```


New session


```bash

mysqld_safe &

```

New session

```bash

mysql -u root

```



New session

```bash

cd proyecto_cracking && nano script_cracking.js

```


```bash

node script_cracking.js

```

