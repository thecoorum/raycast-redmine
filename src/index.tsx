import { useEffect, useState } from "react";
import { Form, ActionPanel, Action, useNavigation, showToast, Toast, LocalStorage } from "@raycast/api";
import axios, { AxiosError } from "axios";

type AuthValues = {
  key: string;
};

type Project = {
  id: number;
  name: string;
  identifier: string;
  description: string;
  status: number;
  created_on: string;
  updated_on: string;
};

type Values = {
  project_id: string;
  spent_on: Date;
  hours: string;
  comments: string;
  activity_id: string;
};

type ActivitySelectProps = {
  id: string;
  title?: string;
  placeholder?: string;
  error?: string;
  onBlur: (event: React.FormEvent<string>) => void;
  onChange?: (value: string | Date | null | undefined) => void;
};

const REQUIRED_FIELDS = ["project_id", "spent_on", "hours", "activity_id"];

const ActivitySelect = ({ id, title, placeholder, onBlur, onChange }: ActivitySelectProps) => (
  <Form.Dropdown id={id} title={title} placeholder={placeholder} onBlur={onBlur} onChange={onChange} defaultValue="16">
    <Form.Dropdown.Item key={16} value="16" title="Estimation" />
    <Form.Dropdown.Item key={147} value="147" title="Bench process" />
    <Form.Dropdown.Item key={17} value="17" title="Bugfix" />
    <Form.Dropdown.Item key={141} value="141" title="Client request/issues" />
    <Form.Dropdown.Item key={146} value="146" title="Consultancy" />
    <Form.Dropdown.Item key={18} value="18" title="Content" />
    <Form.Dropdown.Item key={19} value="119" title="Content-Outstaffing" />
    <Form.Dropdown.Item key={121} value="121" title="Corrections after Feedback" />
    <Form.Dropdown.Item key={8} value="8" title="Design" />
    <Form.Dropdown.Item key={140} value="140" title="Developers request/issues" />
    <Form.Dropdown.Item key={9} value="9" title="Development" />
    <Form.Dropdown.Item key={15} value="15" title="Document" />
    <Form.Dropdown.Item key={144} value="144" title="General Tasks" />
    <Form.Dropdown.Item key={149} value="149" title="Handling complaints" />
    <Form.Dropdown.Item key={139} value="139" title="Job/salary assessments" />
    <Form.Dropdown.Item key={60} value="60" title="Merketing" />
    <Form.Dropdown.Item key={12} value="12" title="Meeting" />
    <Form.Dropdown.Item key={142} value="142" title="Offboarding" />
    <Form.Dropdown.Item key={138} value="138" title="Onboarding" />
    <Form.Dropdown.Item key={59} value="59" title="PM" />
    <Form.Dropdown.Item key={120} value="120" title="Promotion-Outstaffing" />
    <Form.Dropdown.Item key={58} value="58" title="Regression Testing" />
    <Form.Dropdown.Item key={143} value="143" title="Reports" />
    <Form.Dropdown.Item key={40} value="40" title="Research" />
    <Form.Dropdown.Item key={57} value="57" title="Self Bugfix" />
    <Form.Dropdown.Item key={148} value="148" title="Situation/Health check" />
    <Form.Dropdown.Item key={14} value="14" title="Support" />
    <Form.Dropdown.Item key={11} value="11" title="Testing" />
    <Form.Dropdown.Item key={150} value="150" title="commun. with clients (letters)" />
    <Form.Dropdown.Item key={151} value="151" title="non-UA invoices" />
  </Form.Dropdown>
);

const FormPage = () => {
  const [key, setKey] = useState<LocalStorage.Value | undefined>(undefined);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const { push } = useNavigation();

  // let toast: Toast;

  useEffect(() => {
    const fetchKey = async () => {
      // toast = await showToast({
      //   style: Toast.Style.Animated,
      //   title: "Loading",
      //   message: "Loading API key from local storage",
      // });

      const key = await LocalStorage.getItem("key");

      setKey(key);
    };

    fetchKey();
  }, []);

  useEffect(() => {
    if (key && !projects.length) {
      // toast.message = "Loading projects from Redmine";

      axios
        .get("https://red.mobilunity.org/projects.json", {
          headers: {
            "X-Redmine-API-Key": key,
          },
        })
        .then(({ data }) => {
          const projects = data.projects.filter(({ status }: Project) => status === 1);

          setProjects(projects);

          // toast.style = Toast.Style.Success;
        })
        .catch(() => {
          // toast.style = Toast.Style.Failure;
          // toast.message = "Failed to load projects from Redmine";
          // setTimeout(() => {
          //   toast.hide();
          // }, 1500);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [key, projects]);

  const handleRevokeAPIKey = async () => {
    await LocalStorage.removeItem("key");

    setKey(undefined);
  };

  const handleBlur = (id: string, value: string | Date | null | undefined) => {
    if (REQUIRED_FIELDS.includes(id) && !value) {
      setErrors((errors) => ({ ...errors, [id]: "This field is required" }));
    }
  };

  const handleChange = (id: string, value: string | Date | null | undefined) => {
    if (REQUIRED_FIELDS.includes(id) && value) {
      setErrors((errors) => ({ ...errors, [id]: undefined }));
    }
  };

  const handleSubmit = async (values: Values) => {
    Object.entries(values).forEach(([key, value]) => {
      if (REQUIRED_FIELDS.includes(key) && !value) {
        setErrors((errors) => ({ ...errors, [key]: "This field is required" }));

        return;
      }
    });

    if (isNaN(Number(values.hours))) {
      setErrors((errors) => ({ ...errors, hours: "This field must be a number" }));

      return;
    }

    setLoading(true);

    axios
      .post("https://red.mobilunity.org/time_entries.json", null, {
        headers: {
          "X-Redmine-API-Key": key,
        },
        params: {
          "time_entry[project_id]": values.project_id,
          "time_entry[spent_on]": values.spent_on.toISOString().slice(0, 10),
          "time_entry[hours]": values.hours,
          "time_entry[comments]": values.comments,
          "time_entry[activity_id]": values.activity_id,
        },
      })
      .then(() => {
        showToast({
          style: Toast.Style.Success,
          title: "Success",
          message: "Time entry was successfully created",
        });
      })
      .catch((error: Error | AxiosError) => {
        console.error(error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  if (!key) {
    return <AuthPage />;
  }

  return (
    <Form
      isLoading={loading}
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} />
          <Action title="Revoke API Key" onAction={handleRevokeAPIKey} />
        </ActionPanel>
      }
    >
      <Form.Dropdown
        id="project_id"
        title="Project"
        placeholder="Select project"
        onBlur={({ target }) => handleBlur(target.id, target.value)}
        onChange={(value) => handleChange("project_id", value)}
      >
        {projects.map((project) => (
          <Form.Dropdown.Item key={project.id} value={String(project.id)} title={project.name} />
        ))}
      </Form.Dropdown>
      <Form.DatePicker
        id="spent_on"
        title="Date"
        error={errors.spent_on}
        type={Form.DatePicker.Type.Date}
        onBlur={({ target }) => handleBlur(target.id, target.value)}
        onChange={(date) => handleChange("spent_on", date)}
      />
      <ActivitySelect
        id="activity_id"
        title="Activity"
        error={errors.activity_id}
        onBlur={({ target }) => handleBlur(target.id, target.value)}
        onChange={(value) => handleChange("activity_id", value)}
      />
      <Form.TextField
        id="hours"
        title="Hours"
        error={errors.hours}
        onBlur={({ target }) => handleBlur(target.id, target.value)}
        onChange={(value) => handleChange("hours", value)}
      />
      <Form.TextField id="comments" title="Comments" />
    </Form>
  );
};

const AuthPage = () => {
  const [hasKey, setHasKey] = useState<"true" | "false" | "undetermined">("undetermined");

  useEffect(() => {
    const fetchKey = async () => {
      const key = await LocalStorage.getItem("key");

      if (key) {
        setHasKey("true");
      } else {
        setHasKey("false");
      }
    };

    fetchKey();
  }, []);

  const handleSubmit = async ({ key }: AuthValues) => {
    await LocalStorage.setItem("key", key);

    setHasKey("true");
  };

  if (hasKey === "true") {
    return <FormPage />;
  }

  return (
    <Form
      isLoading={hasKey === "undetermined"}
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description text="To use this action you need to enter your Redmine API key" />
      <Form.PasswordField id="key" title="API Key" placeholder="Enter API key" />
    </Form>
  );
};

export default AuthPage;
