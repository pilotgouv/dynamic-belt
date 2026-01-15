
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";

export class ConnectionService {

    static async getActiveConnections(organizationId: string) {
        return await prisma.connection.findMany({
            where: {
                organizationId,
                status: 'ACTIVE'
            },
            include: {
                organization: {
                    include: { settings: true }
                }
            }
        });
    }

    static getDecryptedCredentials(connection: any) {
        if (!connection.credentialsEncrypted) {
            throw new Error("No encrypted credentials found.");
        }
        try {
            const json = decrypt(connection.credentialsEncrypted);
            return JSON.parse(json);
        } catch (e) {
            console.error(`Failed to decrypt for connection ${connection.id}`, e);
            throw new Error("Credential decryption failed.");
        }
    }

    static async markConnectionError(connectionId: string, message: string) {
        await prisma.connection.update({
            where: { id: connectionId },
            data: {
                status: 'ERROR',
                lastSyncStatus: 'failed',
                errorMessage: message
            }
        });
    }

    static async updateLastSync(connectionId: string, status: 'success' | 'failed') {
        await prisma.connection.update({
            where: { id: connectionId },
            data: {
                lastSyncAt: new Date(),
                lastSyncStatus: status,
                errorMessage: status === 'success' ? null : undefined
            }
        });
    }
}
