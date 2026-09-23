import pactum from 'pactum';
import { StatusCodes } from 'http-status-codes';
import { SimpleReporter } from '../simple-reporter';

describe('Aula prática', () => {
  const p = pactum;
  const rep = SimpleReporter;
  const baseUrl = 'https://dnd-combat-api-7f3660dcecb1.herokuapp.com/api';

  p.request.setDefaultTimeout(30000);

  beforeAll(() => p.reporter.add(rep));
  afterAll(() => p.reporter.end());

  describe('Dungeons and Dragons', () => {
    it('Battle loss', async () => {
      await p
        .spec()
        .post(`${baseUrl}/battle/goblin`)
        .withJson({
          name: 'Ugioni',
          strength: 1,
          dexterity: 1,
          hitPoints: 1,
          armorClass: 1
        })
        .expectStatus(StatusCodes.OK)
        .expectBodyContains('Goblin won the battle');
    });

    it('Battle win', async () => {
      await p
        .spec()
        .post(`${baseUrl}/battle/goblin`)
        .withJson({
          name: 'Ugioni',
          strength: 100,
          dexterity: 100,
          hitPoints: 100,
          armorClass: 100
        })
        .expectStatus(StatusCodes.OK)
        .expectBodyContains('Ugioni won the battle');
    });
  });
});
