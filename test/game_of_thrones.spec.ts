import pactum from 'pactum';
import { faker } from '@faker-js/faker';
import { StatusCodes } from 'http-status-codes';
import { SimpleReporter } from '../simple-reporter';

describe('Game of Thrones API', () => {
  const p = pactum;
  const rep = SimpleReporter;
  const baseUrl =
    process.env.GOT_API_URL ??
    'https://got-api.mateusinacio2006.workers.dev/api';
  const nomePersonagem = `${faker.person.firstName()} ${faker.string.alphanumeric(6)}`;
  let idPersonagem = 0;

  p.request.setDefaultTimeout(30000);

  beforeAll(() => p.reporter.add(rep));
  afterAll(() => p.reporter.end());

  describe('Health', () => {
    it('Deve responder que a API está no ar', async () => {
      await p
        .spec()
        .get(`${baseUrl}/health`)
        .expectStatus(StatusCodes.OK)
        .expectJsonLike({ status: 'ok' })
        .expectJsonSchema({
          type: 'object',
          required: ['status', 'timestamp']
        });
    });
  });

  describe('Personagens', () => {
    it('Deve listar somente personagens da casa Stark', async () => {
      await p
        .spec()
        .get(`${baseUrl}/characters`)
        .withQueryParams('house', 'Stark')
        .expectStatus(StatusCodes.OK)
        .expectJsonLike({
          data: [{ name: 'Jon Snow', house: 'Stark' }]
        })
        .expectJsonSchema({
          type: 'object',
          required: ['data', 'total'],
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                required: ['id', 'name', 'house', 'alive'],
                properties: { house: { const: 'Stark' } }
              }
            }
          }
        });
    });

    it('Deve retornar 404 ao buscar personagem inexistente', async () => {
      await p
        .spec()
        .get(`${baseUrl}/characters/999999`)
        .expectStatus(StatusCodes.NOT_FOUND)
        .expectJsonLike({ error: 'not_found' });
    });

    it('Deve recusar cadastro com casa inválida', async () => {
      await p
        .spec()
        .post(`${baseUrl}/characters`)
        .withJson({
          name: nomePersonagem,
          house: 'Frey'
        })
        .expectStatus(StatusCodes.BAD_REQUEST)
        .expectJsonLike({
          error: 'validation_error',
          issues: [{ path: 'house' }]
        });
    });

    it('Deve cadastrar um novo personagem', async () => {
      idPersonagem = await p
        .spec()
        .post(`${baseUrl}/characters`)
        .withJson({
          name: nomePersonagem,
          house: 'Greyjoy',
          title: 'Capitão do Vento Negro'
        })
        .expectStatus(StatusCodes.CREATED)
        .expectJsonLike({
          data: {
            name: nomePersonagem,
            house: 'Greyjoy',
            alive: true
          }
        })
        .returns('data.id');
    });

    it('Deve recusar cadastro com nome repetido', async () => {
      await p
        .spec()
        .post(`${baseUrl}/characters`)
        .withJson({
          name: nomePersonagem,
          house: 'Greyjoy'
        })
        .expectStatus(StatusCodes.CONFLICT)
        .expectJsonLike({ error: 'conflict' });
    });

    it('Deve atualizar o personagem cadastrado', async () => {
      await p
        .spec()
        .put(`${baseUrl}/characters/${idPersonagem}`)
        .withJson({
          name: nomePersonagem,
          house: 'Greyjoy',
          title: 'Rei das Ilhas de Ferro',
          alive: false
        })
        .expectStatus(StatusCodes.OK)
        .expectJsonLike({
          data: {
            id: idPersonagem,
            title: 'Rei das Ilhas de Ferro',
            alive: false
          }
        });
    });

    it('Deve remover o personagem e não encontrar mais', async () => {
      await p
        .spec()
        .delete(`${baseUrl}/characters/${idPersonagem}`)
        .expectStatus(StatusCodes.NO_CONTENT);

      await p
        .spec()
        .get(`${baseUrl}/characters/${idPersonagem}`)
        .expectStatus(StatusCodes.NOT_FOUND);
    });
  });
});
