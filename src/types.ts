export type MCPResponse = {
  content:
    | {
        type: 'text';
        text: string;
      }[]
    | {
        type: 'resource';
        resource: {
          text: string;
          uri: string;
          mimeType?: string;
        };
      }[];
};

export type UserResponse = {
  canny_token: string | null;
  company: string | null;
  email: string;
  first_name: string;
  github_installment_id: string | null;
  id: string;
  job_role: string | null;
  last_name: string;
  pp_consent_date: string | null;
  profile_img_url: string | null;
  tos_consent_date: string | null;
  username: string;
};
