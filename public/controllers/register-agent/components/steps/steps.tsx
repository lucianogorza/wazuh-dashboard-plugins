import React, { useState } from 'react';
import {
  EuiSpacer,
  EuiSteps,
  EuiStepStatus,
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
} from '@elastic/eui';
import { OsCard } from '../os-card/os-card';
import { InputForm } from '../../../../components/common/form';
import './steps.scss';

export const Steps = () => {
  const handleChange = (event: ChangeEvent<any>) => {
    // ver
  };
  const [status, setStatus] = useState<EuiStepStatus>('incomplete');

  let completeButton;
  if (status !== 'complete') {
    completeButton = (
      <EuiButton onClick={() => setStatus('complete')}>
        You complete me
      </EuiButton>
    );
  } else {
    completeButton = (
      <EuiButton onClick={() => setStatus('incomplete')}>Reset</EuiButton>
    );
  }

  let warningButton;
  if (status !== 'warning') {
    warningButton = (
      <EuiButton color='warning' onClick={() => setStatus('warning')}>
        Uh oh!
      </EuiButton>
    );
  } else {
    warningButton = (
      <EuiButton color='warning' onClick={() => setStatus('incomplete')}>
        Reset
      </EuiButton>
    );
  }

  let dangerButton;
  if (status !== 'danger') {
    dangerButton = (
      <EuiButton color='danger' onClick={() => setStatus('danger')}>
        Something terrible
      </EuiButton>
    );
  } else {
    dangerButton = (
      <EuiButton color='danger' onClick={() => setStatus('incomplete')}>
        Reset
      </EuiButton>
    );
  }

  const firstSetOfSteps = [
    {
      title: (
        <EuiTitle className='titleStepOne'>
          <p>Select the package to download and install on your system:</p>
        </EuiTitle>
      ),
      children: (
        <InputForm
          type='custom'
          onChange={handleChange}
          label='Etiqueta del Campo'
          rest={undefined}
          value={undefined}
        />
      ),
    },
    {
      title: 'Push the button to complete this final step',
      children: (
        <>
          <p>We are fancy buttons just waiting to be pushed!</p>
          <EuiSpacer />
          <EuiFlexGroup
            gutterSize='s'
            alignItems='center'
            responsive={false}
            wrap
          >
            <EuiFlexItem grow={false}> {completeButton} </EuiFlexItem>
            <EuiFlexItem grow={false}> {warningButton} </EuiFlexItem>
            <EuiFlexItem grow={false}> {dangerButton} </EuiFlexItem>
          </EuiFlexGroup>
        </>
      ),
      status: status,
    },
  ];

  return <EuiSteps steps={firstSetOfSteps} />;
};
