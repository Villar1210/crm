
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanSocialData() {
    console.log('Iniciando limpeza de dados sociais...');

    // 1. Remover Posts
    const deletedPosts = await prisma.socialPost.deleteMany({});
    console.log(`Posts deletados: ${deletedPosts.count}`);

    // 2. Remover Integrações (Tokens) - necessário antes de remover conexões
    const deletedTokens = await prisma.socialIntegrationToken.deleteMany({});
    console.log(`Tokens deletados: ${deletedTokens.count}`);

    // 3. Remover Conexões de Conta
    const deletedConnections = await prisma.socialAccountConnection.deleteMany({});
    console.log(`Conexões deletadas: ${deletedConnections.count}`);

    // 4. Remover Mídias (opcional, mas bom pra garantir que não fiquem órfãs se o usuário quiser limpo)
    // O usuário reclamou de "dados fake", as mídias do Unsplash entram aqui.
    const deletedMedia = await prisma.socialMediaItem.deleteMany({});
    console.log(`Mídias deletadas: ${deletedMedia.count}`);

    console.log('Limpeza concluída com sucesso!');
}

cleanSocialData()
    .catch((e) => {
        console.error('Erro na limpeza:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
