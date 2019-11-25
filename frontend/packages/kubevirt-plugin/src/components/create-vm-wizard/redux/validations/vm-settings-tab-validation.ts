import * as _ from 'lodash';
import { List } from 'immutable';
import {
  asValidationObject,
  ValidationErrorType,
  ValidationObject,
} from '@console/shared/src/utils/validation';
import { assureEndsWith, joinGrammaticallyListOfItems, makeSentence } from '@console/shared/src';
import { VMSettingsField, VMWizardProps, VMWizardTab } from '../../types';
import {
  hasVmSettingsChanged,
  iGetFieldKey,
  iGetFieldValue,
  iGetVmSettings,
  isFieldRequired,
} from '../../selectors/immutable/vm-settings';
import {
  InternalActionType,
  UpdateOptions,
  VMSettingsValidationConfig,
  VmSettingsValidator,
} from '../types';
import { vmWizardInternalActions } from '../internal-actions';
import {
  validateUserTemplateProvisionSource,
  validateVmLikeEntityName,
} from '../../../../utils/validations/vm';
import {
  VIRTUAL_MACHINE_EXISTS,
  VIRTUAL_MACHINE_TEMPLATE_EXISTS,
} from '../../../../utils/validations/strings';
import { concatImmutableLists, iGet } from '../../../../utils/immutable';
import { getFieldReadableTitle, getFieldTitle } from '../../utils/vm-settings-tab-utils';
import {
  checkTabValidityChanged,
  iGetCommonData,
  iGetLoadedCommonData,
  iGetName,
  immutableListToShallowMetadataJS,
} from '../../selectors/immutable/selectors';
import { validatePositiveInteger } from '../../../../utils/validations/common';
import { pluralize } from '../../../../utils/strings';
import { vmSettingsOrder } from '../initial-state/vm-settings-tab-initial-state';
import { getValidationUpdate } from './utils';

const validateVm: VmSettingsValidator = (field, options) => {
  const { getState, id } = options;
  const state = getState();

  const isCreateTemplate = iGetCommonData(state, id, VMWizardProps.isCreateTemplate);

  const entities = isCreateTemplate
    ? concatImmutableLists(
        iGetLoadedCommonData(state, id, VMWizardProps.commonTemplates),
        iGetLoadedCommonData(state, id, VMWizardProps.userTemplates),
      )
    : iGetLoadedCommonData(state, id, VMWizardProps.virtualMachines);

  return validateVmLikeEntityName(
    iGetFieldValue(field),
    iGetCommonData(state, id, VMWizardProps.activeNamespace),
    immutableListToShallowMetadataJS(entities),
    {
      existsErrorMessage: isCreateTemplate
        ? VIRTUAL_MACHINE_TEMPLATE_EXISTS
        : VIRTUAL_MACHINE_EXISTS,
      subject: getFieldTitle(iGetFieldKey(field)),
    },
  );
};

const validateUserTemplate: VmSettingsValidator = (field, options) => {
  const { getState, id } = options;
  const state = getState();

  const userTemplateName = iGetFieldValue(field);
  if (!userTemplateName) {
    return null;
  }
  const userTemplate = iGetLoadedCommonData(state, id, VMWizardProps.userTemplates, List()).find(
    (template) => iGetName(template) === userTemplateName,
  );

  return validateUserTemplateProvisionSource(userTemplate && userTemplate.toJSON());
};

export const validateOperatingSystem: VmSettingsValidator = (field) => {
  const os = iGetFieldValue(field);
  const guestFullName = iGet(field, 'guestFullName');

  if (os || !guestFullName) {
    return null;
  }

  return asValidationObject(`Select matching for: ${guestFullName}`, ValidationErrorType.Info);
};

const asVMSettingsFieldValidator = (
  validator: (value: string, opts: { subject: string }) => ValidationObject,
) => (field) =>
  validator(iGetFieldValue(field), {
    subject: getFieldTitle(iGetFieldKey(field)),
  });

const validationConfig: VMSettingsValidationConfig = {
  [VMSettingsField.NAME]: {
    detectValueChanges: [VMSettingsField.NAME],
    detectCommonDataChanges: (field, options) => {
      const isCreateTemplate = iGetCommonData(
        options.getState(),
        options.id,
        VMWizardProps.isCreateTemplate,
      );
      return isCreateTemplate
        ? [
            VMWizardProps.activeNamespace,
            VMWizardProps.userTemplates,
            VMWizardProps.commonTemplates,
          ]
        : [VMWizardProps.activeNamespace, VMWizardProps.virtualMachines];
    },
    validator: validateVm,
  },
  [VMSettingsField.USER_TEMPLATE]: {
    detectValueChanges: [VMSettingsField.USER_TEMPLATE],
    detectCommonDataChanges: [VMWizardProps.userTemplates],
    validator: validateUserTemplate,
  },
  [VMSettingsField.OPERATING_SYSTEM]: {
    detectValueChanges: [VMSettingsField.OPERATING_SYSTEM],
    validator: validateOperatingSystem,
  },
  [VMSettingsField.CPU]: {
    detectValueChanges: [VMSettingsField.CPU],
    validator: asVMSettingsFieldValidator(validatePositiveInteger),
  },
  [VMSettingsField.MEMORY]: {
    detectValueChanges: [VMSettingsField.MEMORY],
    validator: asVMSettingsFieldValidator(validatePositiveInteger),
  },
};

export const validateVmSettings = (options: UpdateOptions) => {
  const { id, dispatch, getState } = options;
  const state = getState();
  const vmSettings = iGetVmSettings(state, id);

  const update = getValidationUpdate(validationConfig, options, vmSettings, hasVmSettingsChanged);

  if (!_.isEmpty(update)) {
    dispatch(vmWizardInternalActions[InternalActionType.UpdateVmSettings](id, update));
  }
};

const describeFields = (describe: string, fields: string[]) => {
  if (fields.length > 0) {
    const describedFields = fields
      .sort((a, b) => vmSettingsOrder[iGetFieldKey(a)] - vmSettingsOrder[iGetFieldKey(b)])
      .map((field) => getFieldReadableTitle(iGetFieldKey(field)));
    return makeSentence(
      `${assureEndsWith(describe, ' ')}the following ${pluralize(
        fields.length,
        'field',
      )}: ${joinGrammaticallyListOfItems(describedFields)}.`,
      false,
    );
  }
  return null;
};

export const setVmSettingsTabValidity = (options: UpdateOptions) => {
  const { id, dispatch, getState } = options;
  const state = getState();
  const vmSettings = iGetVmSettings(state, id);

  // check if all required fields are defined
  const emptyRequiredFields = vmSettings
    .filter(
      (field) => isFieldRequired(field) && !field.get('skipValidation') && !field.get('value'),
    )
    .toArray();
  let error = describeFields('Please fill in', emptyRequiredFields);
  const hasAllRequiredFilled = emptyRequiredFields.length === 0;

  // check if fields are valid
  const invalidFields = vmSettings
    .filter((field) => field.getIn(['validation', 'type']) === ValidationErrorType.Error)
    .toArray();
  if (invalidFields.length > 0) {
    error = describeFields('Please correct', invalidFields);
  }
  const isValid = hasAllRequiredFilled && invalidFields.length === 0;

  if (
    checkTabValidityChanged(
      state,
      id,
      VMWizardTab.VM_SETTINGS,
      isValid,
      hasAllRequiredFilled,
      error,
    )
  ) {
    dispatch(
      vmWizardInternalActions[InternalActionType.SetTabValidity](
        id,
        VMWizardTab.VM_SETTINGS,
        isValid,
        hasAllRequiredFilled,
        error,
      ),
    );
  }
};
