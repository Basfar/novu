import '../../src/config';
import {
  OrganizationRepository,
  EnvironmentRepository,
  IntegrationRepository,
  ChannelTypeEnum,
  EnvironmentEntity,
} from '@novu/dal';
import { EmailProviderIdEnum, SmsProviderIdEnum } from '@novu/shared';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../src/app.module';

const organizationRepository = new OrganizationRepository();
const environmentRepository = new EnvironmentRepository();
const integrationRepository = new IntegrationRepository();

const createNovuIntegration = async (
  environment: EnvironmentEntity,
  channel: ChannelTypeEnum.EMAIL | ChannelTypeEnum.SMS
) => {
  const providerId = channel === ChannelTypeEnum.SMS ? SmsProviderIdEnum.Novu : EmailProviderIdEnum.Novu;

  const count = await integrationRepository.count({
    _environmentId: environment._id,
    _organizationId: environment._organizationId,
    providerId,
    channel,
  });

  if (count > 0) {
    return;
  }

  const countChannelIntegrations = await integrationRepository.count({
    _environmentId: environment._id,
    _organizationId: environment._organizationId,
    channel,
  });

  const response = await integrationRepository.create({
    _environmentId: environment._id,
    _organizationId: environment._organizationId,
    providerId,
    channel,
    active: countChannelIntegrations === 0,
  });

  console.log('Created Integration' + response._id);
};

export async function createNovuIntegrations() {
  // Init the mongodb connection
  const app = await NestFactory.create(AppModule, {
    logger: false,
  });

  // eslint-disable-next-line no-console
  console.log('start migration - novu integrations');

  // eslint-disable-next-line no-console
  console.log('get organizations and its environments');

  const organizations = await organizationRepository.find({});
  const totalOrganizations = organizations.length;
  let currentOrganization = 0;
  for (const organization of organizations) {
    currentOrganization += 1;
    console.log(`organization ${currentOrganization} of ${totalOrganizations}`);

    const environments = await environmentRepository.findOrganizationEnvironments(organization._id);
    for (const environment of environments) {
      await createNovuIntegration(environment, ChannelTypeEnum.SMS);
      await createNovuIntegration(environment, ChannelTypeEnum.EMAIL);

      console.log('Prococessed environment' + environment._id);
    }

    console.log('Prococessed organization' + organization._id);
  }

  // eslint-disable-next-line no-console
  console.log('end migration');
}

createNovuIntegrations();
