import React from 'react';
import { render, act, waitFor, fireEvent } from '@testing-library/react';
import ActionForm from '../components/action-form';
import api from '@/lib/api';

jest.mock('@/lib/api');

// Radix UI Select uses scrollIntoView; provide a no-op in JSDOM
// to avoid errors when mounting SelectContent
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window.HTMLElement as any).prototype.scrollIntoView = jest.fn();

describe('ActionForm', () => {
  const mockOnActionChange = jest.fn();
  const mockOnConfigChange = jest.fn();

  const defaultProps = {
    selectedAction: null,
    onActionChange: mockOnActionChange,
    actionConfig: {},
    onConfigChange: mockOnConfigChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Default: no subscribed services, so component renders fallback UI
    (api.get as jest.Mock).mockResolvedValue({ data: { services: [] } });
  });

  test('renders fallback when no services are subscribed', async () => {
    const { getByText } = render(<ActionForm {...defaultProps} />);
    await waitFor(() => {
      expect(
        getByText('No subscribed services with actions found.')
      ).toBeInTheDocument();
      expect(
        getByText('Click here to subscribe to services.')
      ).toBeInTheDocument();
    });
  });

  test('should fetch and display service actions', async () => {
    const mockServiceActions = {
      services: [
        {
          id: 'github',
          service: 'github',
          name: 'GitHub',
          actions: [
            {
              id: '1',
              serviceId: 'github',
              name: 'New Issue',
              description: 'Triggers when a new issue is created',
              configSchema: {
                name: 'GitHub Issue Config',
                description: 'Configuration for GitHub issue creation',
                fields: [{
                  name: 'repository',
                  type: 'string',
                  label: 'Repository',
                  required: true,
                  placeholder: 'user/repo',
                  options: [{ value: 'example/repo', label: 'Example Repo' }],
                  default: ''
                }] as [{ 
                  name: string;
                  type: string;
                  label: string;
                  required: true;
                  placeholder: string;
                  options: [{ value: string; label: string; }];
                  default: string;
                }]
              },
              inputSchema: {
                type: 'object',
                properties: {},
                required: ['repository']
              },
              metadata: {}
            }
          ]
        }
      ]
    };

    (api.get as jest.Mock).mockResolvedValueOnce({
      data: mockServiceActions
    });

  const { getByText, getAllByRole, findByText } = render(<ActionForm {...defaultProps} />);

    // Wait for the select trigger to appear
    await findByText('Select a service');

  // Open the services select to reveal options
  fireEvent.click(getAllByRole('combobox')[0]);

    await waitFor(() => {
      expect(getByText('GitHub')).toBeInTheDocument();
    });

    // Select the service
    fireEvent.click(getByText('GitHub'));
    // Wait for second combobox (actions) to appear
    await waitFor(() => {
      expect(getAllByRole('combobox').length).toBeGreaterThan(1);
    });
    // Open the actions dropdown
    fireEvent.click(getAllByRole('combobox')[1]);
  // Select the action
  fireEvent.click(getByText('New Issue'));
    
    expect(mockOnActionChange).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '1',
        name: 'New Issue'
      })
    );
  });

  test('should render config form for selected action', async () => {
    const selectedAction = {
      id: '1',
      serviceId: 'github',
      name: 'New Issue',
      description: 'Triggers when a new issue is created',
      configSchema: {
        name: 'GitHub Issue Config',
        description: 'Configuration for GitHub issue creation',
        fields: [{
          name: 'repository',
          type: 'string',
          label: 'Repository',
          required: true,
          placeholder: 'user/repo',
          options: [{ value: 'example/repo', label: 'Example Repo' }],
          default: ''
        }] as [{ 
          name: string;
          type: string;
          label: string;
          required: true;
          placeholder: string;
          options: [{ value: string; label: string; }];
          default: string;
        }]
      },
      inputSchema: {
        type: {} as object,
        properties: {},
        required: ['repository'] as [string],
      },
      metadata: {
        category: 'testing',
        tags: ['test'] as [string],
        icon: 'icon',
        color: '#000',
        requiresAuth: true,
        webhookPattern: 'pattern',
      }
    };

    // Provide matching service/actions so component can preselect and render fields
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: {
        services: [
          {
            id: 'github',
            service: 'github',
            name: 'GitHub',
            actions: [
              {
                id: '1',
                serviceId: 'github',
                name: 'New Issue',
                description: 'Triggers when a new issue is created',
                configSchema: selectedAction.configSchema,
                inputSchema: selectedAction.inputSchema,
                metadata: selectedAction.metadata,
              },
            ],
          },
        ],
      },
    });

    const { getByPlaceholderText, findByPlaceholderText } = render(
      <ActionForm
        {...defaultProps}
        selectedAction={selectedAction as any}
      />
    );

    // Wait for the input to render
    const input = (await findByPlaceholderText('user/repo')) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'test/repo' } });

    expect(mockOnConfigChange).toHaveBeenCalledWith({
      repository: 'test/repo'
    });
  });

  test('should handle no subscribed services', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: { services: [] }
    });

    const { getByText } = render(<ActionForm {...defaultProps} />);
    
    await waitFor(() => {
      expect(getByText('No subscribed services with actions found.')).toBeInTheDocument();
      expect(getByText('Click here to subscribe to services.')).toBeInTheDocument();
    });
  });

  test('gracefully handles empty services list', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: { services: [] } });
    const { getByText } = render(<ActionForm {...defaultProps} />);
    await waitFor(() => {
      expect(
        getByText('No subscribed services with actions found.')
      ).toBeInTheDocument();
    });
  });

  test('should validate config form inputs', async () => {
    const selectedAction = {
      id: '1',
      serviceId: 'github',
      name: 'New Issue',
      description: 'Triggers when a new issue is created',
      configSchema: {
        name: 'GitHub Issue Config',
        description: 'Configuration for GitHub issue creation',
        fields: [{
          name: 'repository',
          type: 'string',
          label: 'Repository',
          required: true,
          placeholder: 'user/repo',
          options: [{ value: 'example/repo', label: 'Example Repo' }],
          default: ''
        }] as [{ 
          name: string;
          type: string;
          label: string;
          required: true;
          placeholder: string;
          options: [{ value: string; label: string; }];
          default: string;
        }]
      },
      inputSchema: {
        type: {} as object,
        properties: {},
        required: ['repository'] as [string],
      },
      metadata: {
        category: 'testing',
        tags: ['test'] as [string],
        icon: 'icon',
        color: '#000',
        requiresAuth: true,
        webhookPattern: 'pattern',
      }
    };

    // Provide matching services to render the field
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: {
        services: [
          {
            id: 'github',
            service: 'github',
            name: 'GitHub',
            actions: [
              {
                id: '1',
                serviceId: 'github',
                name: 'New Issue',
                description: 'Triggers when a new issue is created',
                configSchema: selectedAction.configSchema,
                inputSchema: selectedAction.inputSchema,
                metadata: selectedAction.metadata,
              },
            ],
          },
        ],
      },
    });

    const { getByPlaceholderText, findByPlaceholderText } = render(
      <ActionForm
        {...defaultProps}
        selectedAction={selectedAction as any}
      />
    );

    const input = (await findByPlaceholderText('user/repo')) as HTMLInputElement;
    
    // Change value and ensure callback is called with updated config
    fireEvent.change(input, { target: { value: 'x' } });
    fireEvent.blur(input);
    await waitFor(() => {
      expect(mockOnConfigChange).toHaveBeenCalledWith({ repository: 'x' });
    });

    fireEvent.change(input, { target: { value: 'user/repo' } });
    fireEvent.blur(input);
    await waitFor(() => {
      expect(mockOnConfigChange).toHaveBeenCalledWith({ repository: 'user/repo' });
    });
  });
});