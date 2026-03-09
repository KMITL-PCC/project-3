import * as dgram from 'dgram';
import * as radius from 'radius';

interface RadiusConfig {
  host: string;
  port: number;
  secret: string;
}

/**
 * Authenticate a user against a RADIUS server.
 * Resolves to true on Access-Accept, rejects on Access-Reject or timeout.
 */
export function authenticateRadius(
  username: string,
  password: string,
  config?: Partial<RadiusConfig>
): Promise<boolean> {
  const host = config?.host || process.env.RADIUS_HOST || '127.0.0.1';
  const port = config?.port || parseInt(process.env.RADIUS_PORT || '1812', 10);
  const secret = config?.secret || process.env.RADIUS_SECRET || 'radiussecret';
  const nasIp = process.env.NAS_IP || '127.0.0.1';

  return new Promise((resolve, reject) => {
    const client = dgram.createSocket('udp4');

    const packet = radius.encode({
      code: 'Access-Request',
      secret,
      attributes: [
        ['User-Name', username],
        ['User-Password', password],
        ['NAS-IP-Address', nasIp],
      ],
    });

    const timer = setTimeout(() => {
      client.close();
      reject(new Error('RADIUS authentication timed out'));
    }, 5000);

    client.on('message', (msg) => {
      clearTimeout(timer);
      client.close();

      try {
        const response = radius.decode({ packet: msg, secret });
        if (response.code === 'Access-Accept') {
          resolve(true);
        } else {
          reject(new Error('RADIUS Access-Reject: Invalid credentials')); // ถ้า password ผิดจะเข้าที่นี่
        }
      } catch (err: any) {
        reject(new Error(`RADIUS decode error: ${err.message}`));
      }
    });

    client.on('error', (err) => {
      clearTimeout(timer);
      client.close();
      reject(new Error(`RADIUS socket error: ${err.message}`));
    });

    client.send(packet, 0, packet.length, port, host, (err) => {
      if (err) {
        clearTimeout(timer);
        client.close();
        reject(new Error(`RADIUS send error: ${err.message}`));
      }
    });
  });
}
