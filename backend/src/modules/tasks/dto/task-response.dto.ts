import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus, TaskPriority, TaskLocationDto } from './task.dto';

export class TaskResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  jobId: string;

  @ApiProperty({ enum: TaskStatus })
  status: TaskStatus;

  @ApiProperty({ enum: TaskPriority })
  priority: TaskPriority;

  @ApiPropertyOptional()
  assigneeId?: string;

  @ApiPropertyOptional()
  estimatedDuration?: number;

  @ApiPropertyOptional()
  actualDuration?: number;

  @ApiPropertyOptional()
  scheduledStart?: Date;

  @ApiPropertyOptional()
  scheduledEnd?: Date;

  @ApiPropertyOptional()
  startedAt?: Date;

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiProperty()
  order: number;

  @ApiPropertyOptional({ type: [String] })
  checklist?: ChecklistItemDto[];

  @ApiPropertyOptional()
  location?: TaskLocationDto;

  @ApiPropertyOptional()
  instructions?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: () => TaskAssigneeDto })
  assignee?: TaskAssigneeDto;

  @ApiPropertyOptional({ type: () => [TaskSkillDto] })
  requiredSkills?: TaskSkillDto[];

  @ApiPropertyOptional({ type: () => [TaskDependencyDto] })
  dependencies?: TaskDependencyDto[];

  @ApiPropertyOptional({ type: () => [TaskTimeLogResponseDto] })
  timeLogs?: TaskTimeLogResponseDto[];
}

export class ChecklistItemDto {
  @ApiProperty()
  index: number;

  @ApiProperty()
  text: string;

  @ApiProperty()
  completed: boolean;

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiPropertyOptional()
  completedBy?: string;

  @ApiPropertyOptional()
  notes?: string;
}

export class TaskAssigneeDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiPropertyOptional()
  avatar?: string;
}

export class TaskSkillDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  category: string;
}

export class TaskDependencyDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ enum: TaskStatus })
  status: TaskStatus;
}

export class TaskTimeLogResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  taskId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  startedAt: Date;

  @ApiPropertyOptional()
  endedAt?: Date;

  @ApiProperty()
  duration: number;

  @ApiPropertyOptional()
  breakDuration?: number;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  createdAt: Date;
}

export class TaskSummaryDto {
  @ApiProperty()
  totalTasks: number;

  @ApiProperty()
  pendingTasks: number;

  @ApiProperty()
  assignedTasks: number;

  @ApiProperty()
  inProgressTasks: number;

  @ApiProperty()
  completedTasks: number;

  @ApiProperty()
  cancelledTasks: number;

  @ApiProperty()
  overdueTasks: number;

  @ApiProperty()
  totalEstimatedMinutes: number;

  @ApiProperty()
  totalActualMinutes: number;

  @ApiProperty()
  completionRate: number;

  @ApiProperty()
  efficiencyRate: number;
}

export class TaskStatusHistoryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  taskId: string;

  @ApiProperty({ enum: TaskStatus })
  fromStatus: TaskStatus;

  @ApiProperty({ enum: TaskStatus })
  toStatus: TaskStatus;

  @ApiProperty()
  changedBy: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  changedAt: Date;
}
