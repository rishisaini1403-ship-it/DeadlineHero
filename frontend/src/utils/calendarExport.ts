// Calendar Export Utility - Generate .ics files for Google Calendar import

interface Task {
  _id: string;
  title: string;
  description?: string;
  dueDate: string | Date;
  estimatedHours?: number;
  priority?: string;
}

export const exportTaskToCalendar = (task: Task) => {
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const startDate = new Date(task.dueDate);
  const endDate = new Date(startDate.getTime() + (task.estimatedHours || 2) * 60 * 60 * 1000);

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//DeadlineHero//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${task.title}
DESCRIPTION:${task.description || 'Task from DeadlineHero - AI Student Productivity Platform'}
PRIORITY:${task.priority === 'urgent' ? 1 : task.priority === 'high' ? 2 : task.priority === 'medium' ? 3 : 4}
STATUS:NEEDS-ACTION
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `deadlinehero_${task.title.replace(/\s+/g, '_').toLowerCase()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportMultipleTasksToCalendar = (tasks: Task[]) => {
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//DeadlineHero//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
`;

  tasks.forEach((task) => {
    const startDate = new Date(task.dueDate);
    const endDate = new Date(startDate.getTime() + (task.estimatedHours || 2) * 60 * 60 * 1000);

    icsContent += `BEGIN:VEVENT
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${task.title}
DESCRIPTION:${task.description || 'Task from DeadlineHero'}
PRIORITY:${task.priority === 'urgent' ? 1 : task.priority === 'high' ? 2 : task.priority === 'medium' ? 3 : 4}
STATUS:NEEDS-ACTION
END:VEVENT
`;
  });

  icsContent += `END:VCALENDAR`;

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `deadlinehero_all_tasks.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
